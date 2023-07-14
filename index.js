const { default: axios } = require("axios");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");
const mime = require("mime-types");
const express = require("express");

let cargado = false;

// CLIENTE DE WHATSAPP BOT
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  cargado = true;
  console.log("Client is ready!");
  setInterval(() => {
    console.log("Reset");
  }, 60000);
});

client.on("message", async (message) => {
  if (message.body === "!ping") {
    message.reply("pong");
  } else if (message.body === "!help") {
    message.reply(
      "BOT opciones:\n!usd - Devuelve el valor del Dolar Blue\n!usd.1234 - Convierte a pesos\n!euro - Devuelve el valor del Euro Blue\n!euro.1234 - Convierte a pesos\n!pesos.1234 - Convierte los pesos en Dolar y Euro"
    );
  } else if (message.body === "!usd") {
    const { data } = await axios.get(
      "https://mercados.ambito.com/dolar/informal/variacion"
    );

    message.reply(data.venta);
  } else if (message.body.slice(0, 5) === "!usd.") {
    let result = parseFloat(message.body.slice(5, message.body.length));
    const { data } = await axios.get(
      "https://mercados.ambito.com/dolar/informal/variacion"
    );

    message.reply(
      `U$D${result} = $${(
        parseFloat(result) * parseFloat(data.venta)
      ).toFixed()}`
    );
  } else if (message.body === "!euro") {
    const { data } = await axios.get(
      "https://mercados.ambito.com/euro/informal/variacion"
    );

    message.reply(data.venta);
  } else if (message.body.slice(0, 6) === "!euro.") {
    let result = message.body.slice(6, message.body.length);
    const { data } = await axios.get(
      "https://mercados.ambito.com/euro/informal/variacion"
    );

    message.reply(
      `€${parseFloat(result).toFixed} = $${parseFloat(
        result * data.venta
      ).toFixed()}`
    );
  } else if (message.body.slice(0, 7) === "!pesos.") {
    let result = parseFloat(message.body.slice(7, message.body.length));
    const { data: euro } = await axios.get(
      "https://mercados.ambito.com/euro/informal/variacion"
    );
    const { data: dolar } = await axios.get(
      "https://mercados.ambito.com/dolar/informal/variacion"
    );

    message.reply(
      `$${result} = €${(
        result / parseFloat(euro.venta)
      ).toFixed()}\n$${result} = U$D${(
        result / parseFloat(dolar.venta)
      ).toFixed()}`
    );
  } else if (message.body === "!sticker") {
    if (message.hasMedia) {
      message.downloadMedia().then((media) => {
        if (media) {
          const mediaPath = "./downloaded-media/";

          if (!fs.existsSync(mediaPath)) {
            fs.mkdirSync(mediaPath);
          }

          const extension = mime.extension(media.mimetype);
          const filename = new Date().getTime();
          const fullFilename = mediaPath + filename + "." + extension;

          try {
            fs.writeFileSync(fullFilename, media.data, { encoding: "base64" });

            MessageMedia.fromFilePath((filePath = fullFilename));
            client.sendMessage(
              message.from,
              new MessageMedia(media.mimetype, media.data, filename),
              {
                sendMediaAsSticker: true,
                stickerAuthor: "Created By BOT",
                stickerName: "Stickers",
              }
            );
            fs.unlinkSync(fullFilename);
          } catch (err) {
            console.log("Failed to save the file:", err);
          }
        }
      });
    } else {
      message.reply(`Manda una imagen con *!sticker*`);
    }
  } else {
    message.reply(
      "BOT opciones:\n!usd - Devuelve el valor del Dolar Blue\n!usd.1234 - Convierte a pesos\n!euro - Devuelve el valor del Euro Blue\n!euro.1234 - Convierte a pesos\n!pesos.1234 - Convierte los pesos en Dolar y Euro"
    );
  }
});

client.initialize();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ Cargado: cargado });
});

app.listen(PORT, () => {
  console.log(`Escuchando en el puerto ${PORT}`);
});
