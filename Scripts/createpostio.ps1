# Scripts/createpostio.ps1
docker stop mail-test
docker rm mail-test
docker run -d `
    --name mail-test `
    -p 8080:80 `
    -e "HTTPS=OFF" `
    -v "C:\poste-data:/data" `
    analogic/poste.io