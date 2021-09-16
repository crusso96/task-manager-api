const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user')
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router();

// Sign up user
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
        await user.save();   
        sendWelcomeEmail(user.email, user.name);

        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
      res.status(400).send(e);
  }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please provide only a .jpg, .jpeg, or .png document.'))
        }

        cb(undefined, true)
    }
})

// UPLOAD avatar to user profile
router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res) => {
    // reformat image
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

// DELETE avatar from user profile
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send(req.user)
})

// GET user's avatar by user ID
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }

})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
})

// Log user out 
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

// Log out of ALL instances 
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

// get profile ONLY for the person who is logged in 
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

// update existing user ... mongoose findByIdAndUpdate
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];

    //run function for every item in array
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates' });
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

// delete user that is currently logged in
router.delete('/users/me', auth, async (req, res) => {
  try {
      await req.user.remove()
      sendCancellationEmail(req.user.email, req.user.name);
      res.send(req.user);

  } catch (e) {
      res.status(500).send();
  }
})


module.exports = router;