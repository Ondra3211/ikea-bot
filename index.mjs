import ikea from 'ikea-availability-checker';
import nodemail from 'nodemailer';
import fs from 'fs';

const COUNTRY_CODE = 'cz';
const CONFIG = JSON.parse(fs.readFileSync('config.json'));

const status = fs.readFileSync('status.json');
let statusJson = JSON.parse(status);

const stores = ikea.stores.findByCountryCode(COUNTRY_CODE);

let prodejny = '';

for (let store of stores) {
    const availability = await ikea.availability(store.buCode, CONFIG.product);
    if (availability.stock > 0) {
        prodejny += availability.store.name + ': ' + availability.stock + ' ks\n';
    }
}

if (!statusJson.odeslano && prodejny != '') {

    let zprava = 'BLÅHAJ je skladem na těchto prodejnách:\n\n' + prodejny;
    zprava += '\nhttps://www.ikea.com/cz/cs/p/blahaj-plysova-hracka-zralok-30373588/';

    const mail = nodemail.createTransport({
        host: 'smtp.seznam.cz',
        port: 465,
        secure: true,
        auth: {
            user: CONFIG.emailUser,
            pass: CONFIG.emailPass,
        },
    });
    await mail.sendMail({
        from: 'Ondra - IKEA BOT <blahaj@onni.cz>',
        to: CONFIG.emailTo,
        subject: 'BLÅHAJ je na skladě!',
        text: zprava,
    });

    console.log('Email odeslán');
    statusJson.odeslano = true;
}

fs.writeFileSync('status.json', JSON.stringify(statusJson));
