// import {RouterModule, Routes} from '@angular/router';

var app = angular.module('flapperNews', ['ui.router']); //This is the Angular app, needs to be called in the HTML for any of the Angular to actually work

app.config([
'$stateProvider',
'$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {

    $stateProvider.state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          postPromise: ['posts', function(posts) {
            return posts.getAll();
          }]
        }
      }).state('posts', {
        url: '/posts/:id',
        templateUrl: '/posts.html',
        controller: 'PostsCtrl',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts) {
            return posts.get($stateParams.id);
          }]
        }
      });
    $urlRouterProvider.otherwise('home');

  }
]);

app.factory('posts', ['$http', function($http) {
  var o = {
    posts: []
  };

  o.getAll = function() {
    return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };

//create a post
  o.create = function(post) {
    return $http.post('/posts', post).success(function(data){
      o.posts.push(data);
    });
  };

//upvote post
  o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote')
    .success(function(data){
      post.upvotes += 1;
    });
  };

//downvote post
  o.downvote = function(post) {
	  return $http.put('/posts/' + post._id + '/downvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    post.upvotes -= 1;
	  });
	};

  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res){
      return res.data;
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment);
  };

  //upvote comment
    o.upvote = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote')
      .success(function(data){
        comment.upvotes += 1;
      });
    };

  return o;
}]);

app.controller('PostsCtrl', ['$scope', 'posts', 'post', function($scope, posts, post){
$scope.post = post;

  $scope.addComment = function(){
    if($scope.body === '') { return; }
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user',
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
  }

  $scope.incrementUpvotes = function(comment){
    posts.upvoteComment(post,comment);
  };

  $scope.body = '';
}

//a bit more specific than app, there can be many controllers within a single app. Still needs to be added to the HTML to be effective
app.controller('MainCtrl', [
'$scope', 'posts', function($scope, posts){ //not 100% sure on why I need this large anonymous function

//This is the posts array, it was originally a set array, now it's calling the posts Factory and will be replaced by MongoDB eventually!
  $scope.posts = posts.posts;

  $scope.addPost = function() {
    if(!$scope.title || $scope.title === '') {
      return;
    }
    posts.create({
      title: $scope.title,
      link: $scope.link,
      upvotes: 0,
    }); //This adds the new post to the Posts array

    $scope.title = ''; //This resets the input box for title to be blank
    $scope.link = '';
  };

  $scope.incrementUpvotes = function(post) {
    post.upvote(post);
  };
}]);
