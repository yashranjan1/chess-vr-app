# Yash's Final Year Project

## VR Chess in A-Frame
This is the instructions page to the VR in A-Frame repository. Here is how you can run this project.

## Essentials
You will need to following packages from node's package manager to run this project
- express v4.18.2
- ws v8.12.1 

Note: The "v" in the above points indicates version number

## NGROK

In case you want this application to be accessible over the internet, you will have to open a TCP tunnel to the port 3000 on your laptop. This is because this project runs on port 3000 on your device. Instructions on how to do so can be found here - https://ngrok.com/docs/secure-tunnels/tunnels/tcp-tunnels/ 

## Running the project

After you have everything you need simply enter "npm start" in the terminal on the root directory. If that does not work, try running "node server.js".

## Accessing the game

If you are running the game on your local machine, go to "https://localhost:3000" to play the game. If you are playing to game over the internet, with the server running on a different machine, run the NGROK script on the host machine and visit "https://{enter-tcp-address-here-without-the-tcp://}". The browser might say that the website is not secure. Click on advanced and proceed anyway. This is because I signed the SSL certificate and the browser does not recognised me, which makes the certificate not trustable.

## Playing the game

Once the scene loads you will be on the instructions scene. Click on the VR button at the bottom right corner to access the page in VR. You can then play the instructions to understand how the game works. If you want to skip this, either go to the last slide and click on "Next" or click on "Skip".

## About this project

This is my final year project from my bachelor's degree. The reason there are no commits on this repository is because I used my university's private GitLab as version control. More information about this project can be found on https://pats.cs.cf.ac.uk/archive. My project is listed under the Student name "Yash Ranjan" and Project title 	"VR Chess Application".