import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { nanoid } from 'nanoid';
import path from 'node:path';

class FileController {
  async upload(req: any, res: any) {
    try {
      const file = req.files.file;

      if (!file) {
        return res.status(400).json({ message: 'File not found' });
      }

      if (!/^image/.test(file.mimetype)) {
        return res.status(400).json({ message: 'File upload error' });
      }

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const id = nanoid(7);
      const fileName = `${id}_${file.name}`;
      const location = `/uploads/${fileName}`;
      const fileDir = path.join(__dirname, '/../public/uploads/', fileName);
      file.mv(fileDir);
      return res.json({
        message: 'File Upload success',
        location,
      });
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: 'File Upload error' });
    }
  }
}

export default new FileController();
