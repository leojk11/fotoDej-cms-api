const fs = require('fs');

const { errorMessages } = require('../helpers/errorMessages');
const { statusCodes } = require('../helpers/statusCodes');

exports.getImage = (req, res) => {
    if(req.params.img) {
        const image = req.params.img;
        res.status(statusCodes.success)
            .sendFile('./images/' + image, { root: '.' }, (error) => {
                if(error) {
                    res.status(statusCodes.user_error).json({
                        message: `Image ${ image } has not been found.`
                    })
                }
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: 'Please provide image name.'
        });
    }
}

exports.uploadImagesV2 = (req, res) => {
  if (!req.files) {
    res.status(statusCodes.user_error).json({
      message: 'Please select at least 1 image!'
    });
  } else {
    const file = req.files.images;

      try { file.mv('./images/' + file.name).then(); }
      catch (e) {
          console.log(e);
          return res.send({
              success: false,
              message: 'upload error',
              error: e
          });
      }

    res.status(200).json({ success: true, message: 'uploaded successfully' });
  }
}

exports.delete = (req, res) => {
  const path = './images/';
  const images = req.body.images;

  try {
    let message;
    
    if(images.length === 0) {
      fs.unlinkSync(path + images[0]);

      message = 'Image has been deleted.'
    } else {
      for(const image of images) {
        fs.unlinkSync(path + image);
      }

      message = 'Images have been deleted.'
    }

    res.status(statusCodes.success).json({ message });
  } catch (error) {
    res.status(statusCodes.internal).json({
      message: errorMessages.internal,
      error
    });
  }
}
