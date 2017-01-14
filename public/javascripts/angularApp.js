// import {RouterModule, Routes} from '@angular/router';

var app = angular.module('flapperNews', ['ui.router']); //This is the Angular app, needs to be called in the HTML for any of the Angular to actually work

app.config([
'$stateProvider',
'$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl'
      }).state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostsCtrl'
      });

    $urlRouterProvider.otherwise('home');

  }
]);

app.factory('posts', [function() {
  var o = {
    posts: []
  };
  return o;
}]);

app.controller('PostsCtrl', ['$scope', '$stateParams', 'posts', function($scope, $stateParams, posts){
$scope.post = posts.posts[$stateParams.id];

$scope.addComment = function(){
  if($scope.body === '') { return; }
  $scope.post.comments.push({
    body: $scope.body,
    author: 'user',
    upvotes: 0
  });
  $scope.body = '';
}
}]);

//a bit more specific than app, there can be many controllers within a single app. Still needs to be added to the HTML to be effective
app.controller('MainCtrl', [
'$scope', 'posts', function($scope, posts){ //not 100% sure on why I need this large anonymous function

//This is the posts array, it was originally a set array, now it's calling the posts Factory and will be replaced by MongoDB eventually!
  $scope.posts = posts.posts;

  $scope.addPost = function() {
    if(!$scope.title || $scope.title === '') {
      return;
    }
    $scope.posts.push({
      title: $scope.title,
      link: $scope.link,
      upvotes: 0,
      comments: [
        {author: 'Joe', body: 'Cool post!', upvotes: 0},
        {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
      ]
    }); //This adds the new post to the Posts array

    $scope.title = ''; //This resets the input box for title to be blank
    $scope.link = '';
  };

  $scope.incrementUpvotes = function(post) {
    post.upvotes += 1;
  };
}]);
