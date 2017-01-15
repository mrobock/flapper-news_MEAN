var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');


var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

//Pre-Loads posts for routes that require a post ID
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Get all Posts using a GET request
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err);}

    res.json(posts);
  });
});

//Create a post using a POST request
router.post('/posts', function(req, res, next) {
  var post = new Post(req.body);

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

//Get a single post (uses pre-loader router.param function from above)
router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(req.post);
  });
});

//Add upvote to posts!
router.put('/posts/:post/upvote', function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  })
})

//Create a comment for a particular post
router.post('/posts/:post/comments', function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  })
})

//Add upvote to comments posts!
router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
  req.post.comment.upvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  })
})

module.exports = router;
