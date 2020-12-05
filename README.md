## Teamfinder application

The client repo can be found [here]() (Still work in progress)

---

**General Notes:**
As of now I dont have a working application to display. It is still a work in progress, since I kind of went my own ways with the project, and spend most of the time on a major refactoring of the backend in order to refine it.
The client application will follow, and at the exam I will, hopefully, have a fully fledged application.

Hopefully, I'll still be eligible for study points for this period.

I implemented the following in the backend:

### 1. Mongoose

Just like we used jpa on the previous semester, I introduced Mongoose to achive the same functionality with JS. Mongoose is an ODM and allows me to get even better typesafety with schemas and models.
Mongoose also allows me to create the connection to the database _once_ in [app.ts](https://github.com/dublo144/fsjs-teamfinder-backend/blob/master/src/app.ts). Getting Mongoose and Typescript to work together was quite a hassle, but it'll also make my life easier when we will introduce GraphQL later on.

### 2. GameArea in DB in stead of hardcoded.

Here I also refactored the logic around the gamearea. A user can be in multiple, overlapping gameareas for instance, aswell as a user cant find other players, unless the user is inside a GameArea.
This refactoring also allowed me to nuke the GeoApi, since it is now a part of the [GameApi.ts](https://github.com/dublo144/fsjs-teamfinder-backend/blob/master/src/routes/gameAPI.ts)

### Better authentication with Middleware, and JWT

The old way of authenticating by essentially signing in on every request was inefficient.
I refactored to use a JWT style approach. The token is issued when the user signs in, and contains all the user-information - except password of course.

On every request the [authMiddleware.ts](https://github.com/dublo144/fsjs-teamfinder-backend/blob/master/src/middlewares/authMiddleware.ts) will check for an 'Authentication'-header. If the header is present, the token will be decoded and the user object will be set on the request.

It does not throw an error if theres no token. In that case, no user object is set on the request, and it is the job of the functions that require authentication to check, and potentially throw an error.

### Test overhaul

Of course all of the above (plus more), required me to give the tests a majo overhaul as well.
