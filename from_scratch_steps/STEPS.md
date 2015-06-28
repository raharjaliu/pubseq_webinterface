Steps needed to create minimal working web app with Node.js and Express

1.) Download Node.js installer file (https://nodejs.org/download/)

2.) Run the installer, check version of node and npm (`node -v` and `npm -v` respectively)

3.) Installation and initial testing:

**EITHER**

- go to directory for the webapp and do following: `npm init`
- this will initate npm. Select following for paramter:
 - `name: pubseq_webapp (or any name)`
 - `version: 1.0.0`
 - `description: web interface for PubSeq`
 - `entry point: app.js`
 - `test command:`
 - `git repository:`
 - `keywords:`
 - `license: MIT`
- on the same directory, do the following: `npm install express --save`
- edit app.js in following way (http://expressjs.com/starter/hello-world.html)
- run the app: `node app.js`

**OR**

- install express-generator: `npm install express-generator -g`
- check the help for express: `express -h`
- go to working directory (the one containing the directory `pubseq_webapp`) and do following: `express pubseq_webapp`
- install dependency: `cd pubseq_webapp && npm install`
- run the app: `DEBUG=pubseq_webapp:* npm start`

4.) Post installation
Open (http://localhost:3000/) to see the result. The server can be run either using 'npm start' or 'node web.app'. See here (http://stackoverflow.com/questions/11716421/node-js-express-npm-start)  for the difference between the two.

**NOTE** It is highly recommended that we use the later alternative on 3.) since we would use `jade` a lot (which `express-generator` already included during the generation) for HTML creation.

5.) Check `app.js` and `views/` directory of `HOME/pubseq_webapp/` to see the example of how to implement the webpage
