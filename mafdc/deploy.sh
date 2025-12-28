#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Copy the build files to the server
echo "Copying build files to server..."
scp -r .next/* kali@192.168.100.13:/home/kali/mafdc/

# Copy PWA files to the server
echo "Copying PWA files to server..."
scp public/manifest.json kali@192.168.100.13:/home/kali/mafdc/
scp public/sw.js kali@192.168.100.13:/home/kali/mafdc/
scp public/Mafdc.jpg kali@192.168.100.13:/home/kali/mafdc/

# Copy logo files for reports
echo "Copying logo files to server..."
scp public/nogo.png kali@192.168.100.13:/home/kali/mafdc/
scp public/wogo.png kali@192.168.100.13:/home/kali/mafdc/

echo "Deployment completed!"
