class FileController {
  async upload(req: any, res: any) {
    try {
      const file = req.files.file;

      if (!file) {
        return res.status(400).json({ message: 'File not found' });
      }

      return res.json({
        message: 'File Upload success',
        files: req.files.file,
      });
    } catch (e) {
      return res.status(400).json({ message: 'File Upload error' });
    }
  }
}

export default new FileController();
