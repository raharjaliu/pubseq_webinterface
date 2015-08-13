# Running the Webapp

## Requirements

To start this web page properly, user needs to, upon downloading:


* have PubSeq Index running in the same machine (localhost) and listening to port 8983. Note that the system is supposed to be running in a Virtual Machine due to interaction constraints between Solr, PubSeq web server, the clusters and open world.
* download all required node.js library. On the directory where `package.json` is located, just do `npm install`.
* run by doing `node app.js` in this directory
