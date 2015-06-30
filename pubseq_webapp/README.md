# Running the Webapp

## Dependencies Installation

If the webapp bundle is cloned/forked from github, install dependencies defined at `package.json`. See for example here (http://stackoverflow.com/questions/8367031/how-do-i-install-package-json-dependencies-in-the-current-directory-using-npm).

## Running the App

As of current dev version 0.0.1, just do `node apps.js` in this directory.

## Connection with Solr Server

(This applies to dev version 0.0.1)

If the webapp bundle is cloned/forked from github, it is assumed that the Solr index wasn't set up on the computer/server the app is running on. In that case, do following:

* Comment lines 38-59 of file `views/search.jade`.
* Move the line `window.location.replace('/results');` (line 54) to right after `console.log("GET-ing from Solr server");` (line 36).

That part communicates with Solr server and since you Solr server wasn't set up, it will throw an exception.
