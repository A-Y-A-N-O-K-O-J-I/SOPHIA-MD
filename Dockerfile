FROM quay.io/ayanokojix2306/kojixsophia:latest
RUN git clone https://github.com/A-Y-A-N-O-K-O-J-I/SOPHIA-MD /sophia
RUN chown -R node:node /sophia
USER node
WORKDIR /sophia
RUN npm install
CMD ["sh", "-c", "npm start"]