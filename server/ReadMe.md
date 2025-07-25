To run the project run npm i then nodemon index.js

in the routes folder it will contain both the routes and the controllers 
and for the DB schema it will all be in one file the prisma created one 




Some Prisma Commands for you : 
to inisilize Prisma run : 
npm install prisma --save-dev
npm install @prisma/client
npx prisma init


to push the Prisma schema to the database run : npx prisma db push
to generate the Prisma client run : npx prisma generate
to view the Prisma studio run : npx prisma studio
   



and these are what you need to put in the .env file 

CLOUDINARY_CLOUD_NAME=dhu2uyrwx
CLOUDINARY_API_KEY=788597126994445
CLOUDINARY_API_SECRET=bKnb171hw-xKC5u5ImUZ13F0Boc
JWT_SECRET=b28713259a64495246c4a82d74fjaldjasdk9sdiuasd7951a280961cda719ce3c5c2ae7fd761f332ef2f8e03f025fc3cb0c1b82ddf6798fbf0814ddf5c1
EMAIL_USER=softwebelevation@gmail.com
EMAIL_PASS=gjxo yuph squo ojde
DATABASE_URL=postgresql://studyhubdb_user:x30uGvviHzTIpBYrAE101hGI0CjrxA5n@dpg-d1odra7fte5s73b6vlo0-a.oregon-postgres.render.com/studyhubdb
