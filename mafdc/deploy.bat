@echo off
echo Building the application...
call npm run build

echo Copying build files to server...
scp -r .next/* kali@192.168.100.13:/home/kali/mafdc/

echo Copying PWA files to server static directory...
ssh kali@192.168.100.13 "mkdir -p /home/kali/mafdc/static"
scp public/manifest.json kali@192.168.100.13:/home/kali/mafdc/static/
scp public/sw.js kali@192.168.100.13:/home/kali/mafdc/static/
scp public/Mafdc.jpg kali@192.168.100.13:/home/kali/mafdc/static/

echo Deployment completed!
pause
