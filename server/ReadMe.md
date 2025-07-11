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