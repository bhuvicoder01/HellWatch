const { GetObjectCommand, S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const audioModel = require("../models/Audio");
const S3 = require("../services/s3");

const s3=S3.s3
const BUCKET = 'bhuvistestvideosdatabucket';

class songController{
    static async listAudios(req, res) {
      try {
        const audios = await audioModel.find().sort({ createdAt: -1 }); // latest first
        // send only what React needs
        const formatted = audios.map(v => ({
          id: v._id,
          owner: v?.owner,
          title: v?.title,
          key: v.key,
          thumbnail: v.thumbnail,
          qualities: Object.fromEntries(v.qualities || new Map()),
          createdAt: v.createdAt
        }));
        res.json(formatted);
      } catch (err) {
        console.error(err);
        res.sendStatus(500);
      }
    }

     static async getSongThumbnail(req,res){
          try {
            const { id } = req.params;
            const song = await audioModel.findById(id);
            if (!song || !song.thumbnail) {
              return res.sendStatus(404);
            }
            
            const command = new GetObjectCommand({
              Bucket: BUCKET,
              Key: song.thumbnail
            });
            
            const data = await s3.send(command);
            res.setHeader('Content-Type', 'image/jpeg');
            data.Body.pipe(res);
    
            
          } catch (error) {
            console.error(error);
            res.sendStatus(500);
            
          }
        }
     static async streamAudio(req, res) {
  try {
    const audioDoc = await audioModel.findById(req.params.id);
    if (!audioDoc) return res.sendStatus(404);

    const quality = req.query.quality || 'high';
    let key = audioDoc.key;
    
    // Use quality-specific key if available
    if (quality !== 'original' && audioDoc.qualities && audioDoc.qualities.get(quality)) {
      key = audioDoc.qualities.get(quality);
    }

    const range = req.headers.range;
    if (!range) {
      return res.status(416).send("Requires Range header");
    }

    // Get total size
    const headData = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    const audioSize = headData.ContentLength;


    const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, audioSize - 1);
    const contentLength = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${audioSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": headData.ContentType || "audio/mp3",
      "X-Quality": quality
    });

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: `bytes=${start}-${end}`
    });

    const data = await s3.send(command);
    data.Body.pipe(res);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}
        
    
}
module.exports=songController;