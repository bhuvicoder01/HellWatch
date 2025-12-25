const audioModel = require("../models/Audio");

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
}
module.exports=songController;