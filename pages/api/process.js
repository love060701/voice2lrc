import { GoogleGenerativeAI } from '@google/generative-ai';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();

    form.parse(req, async function (err, fields, files) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '文件解析错误' });
      }

      const apiKey = fields.apiKey;
      const file = files.file;

      if (!apiKey || !file) {
        return res.status(400).json({ error: '缺少 API Key 或音频文件' });
      }

      try {
        // 读取文件数据
        const filePath = file.filepath;
        const mimeType = file.mimetype;
        const fileData = fs.readFileSync(filePath);
        const base64AudioFile = fileData.toString('base64');

        // 初始化生成式 AI 客户端
        const genAI = new GoogleGenerativeAI(apiKey);

        // 初始化 Gemini 模型
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-16k',
        });

        // 使用提示词和音频数据生成内容
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64AudioFile,
            },
          },
          { text: '请将音频内容转为逐字歌词，并为每句歌词添加时间戳，生成标准的 lrc 格式的歌词文件内容。' },
        ]);

        const lrcContent = await result.response.text();

        // 返回 lrc 内容
        res.status(200).json({ lrcContent });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: '处理失败' });
      }
    });
  } else {
    res.status(405).json({ error: '不支持的请求方法' });
  }
}
