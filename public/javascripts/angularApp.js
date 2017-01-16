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
      }).state('login', {
          url: '/login',
          templateUrl: '/login.html',
          controller: 'AuthCtrl',
          onEnter: ['$state', 'auth', function($state, auth){
            if(auth.isLoggedIn()){
              $state.go('home');
            }
          }]
        }).state('register', {
          url: '/register',
          templateUrl: '/register.html',
          controller: 'AuthCtrl',
          onEnter: ['$state', 'auth', function($state, auth){
            if(auth.isLoggedIn()){
              $state.go('home');
            }
          }]
        });

    $urlRouterProvider.otherwise('home');

  }
]);

app.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  auth.saveToken = function(token){
    $window.localStorage['flapper-news-token'] = token;
  };

  auth.getToken = function() {
    return $window.localStorage['flapper-news-token'];
  };

  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if(token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('flapper-news-token');
  };


  return auth;
}]);



app.factory('posts', ['$http', 'auth', function($http, auth) {
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
  return $http.post('/posts', post, {
    headers: {Authorization: 'Bearer '+ auth.getToken()}
  }).success(function(data){
    o.posts.push(data);
  });
};

//upvote post
  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+ auth.getToken()}
    }).success(function(data){
      post.upvotes += 1;
    });
  };

//downvote post
  o.downvote = function(post) {
	  return $http.put('/posts/' + post._id + '/downvote', null, {
	    headers: {Authorization: 'Bearer '+ auth.getToken()}
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
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+ auth.getToken()}
    });
  };

  //upvote comment
    o.upvoteComment = function(post, comment) {
      return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
  	    headers: {Authorization: 'Bearer '+auth.getToken()}
  	  }).success(function(data){
  	    comment.upvotes += 1;
  	  });
  	};

  return o;
}]);



app.controller('NavCtrl', [
'$scope',
'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
  }
]);

app.controller('PostsCtrl', ['$scope', 'posts', 'post', 'auth', function($scope, posts, post, auth){
  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addComment = function(){
    if($scope.body === '') { return; }
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user',
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
  };

  $scope.upvote = function(comment){
    posts.upvoteComment(post, comment);
  };


}]);

//a bit more specific than app, there can be many controllers within a single app. Still needs to be added to the HTML to be effective
app.controller('MainCtrl', [
'$scope', 'posts', 'auth', function($scope, posts, auth){ //not 100% sure on why I need this large anonymous function

//This is the posts array, it was originally a set array, now it's calling the posts Factory and will be replaced by MongoDB eventually!
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addPost = function() {
    if(!$scope.title || $scope.title === '') {
      return;
    }
    posts.create({
      title: $scope.title,
      link: $scope.link,
      // upvotes: 0,
    }); //This adds the new post to the Posts array

    $scope.title = ''; //This resets the input box for title to be blank
    $scope.link = '';
  };

  $scope.upvote = function(post) {
    posts.upvote(post);
  };
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
  function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };

    $scope.logIn = function(){
      auth.logIn($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };
}]);
