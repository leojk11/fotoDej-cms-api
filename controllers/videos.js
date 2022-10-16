const fs = require('fs');

const { statusCodes } = require('../helpers/statusCodes');

exports.get = (req, res) => {
    if(req.params.video) {
        console.log('video', req.params.video);
        const video = req.params.video;
        res.status(statusCodes.success)
            .sendFile('./videos/' + video, { root: '.' }, (error) => {
                if(error) {
                    // res.status(statusCodes.user_error).json({
                    //     message: `Video ${ video } has not been found.`
                    // })
                }
            });
    } else {
        res.status(statusCodes.user_error).json({
            message: 'Please provide video name.'
        });
    }
}

exports.upload = (req, res) => {
    if (!req.files) {
        res.status(statusCodes.user_error).json({
          message: 'Please select at least 1 video!'
        });
    } else {
        const file = req.files.video;
    
        try {
            file.mv('./videos/' + file.name).then();
        }
        catch (e) {
            console.log(e);
            return res.send({
                success: false,
                message: 'upload error',
                error: e
            });
        }
    }
}