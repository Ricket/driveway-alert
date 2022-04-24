require('dotenv').config();

const _ = require('lodash');

// telegram
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env['TELEGRAM_BOT_TOKEN']);
slimbot.startPolling();

// event handler
function onDrivewayAlert(obj) {
    // console.dir(obj);
    let message = `Driveway alert at ${obj.time}`;
    if (obj['battery_ok'] !== '1') {
        message += ` LOW BATTERY (${obj['battery_ok']})`;
    }
    slimbot.sendMessage(process.env['TELEGRAM_CHAT_ID'], message);
}
const throttledOnDrivewayAlert = _.throttle(onDrivewayAlert, 10000, {'trailing': false});

// spawn the radio process
const { spawn } = require('child_process');
const rtl433 = spawn('/usr/bin/rtl_433', ['-F', 'json', '-c', 'MightyMule-FM231.conf']);

const readline = require('readline');
const stdout = readline.createInterface({
    input: rtl433.stdout,
    crlfDelay: Infinity
});

stdout.on('line', (line) => {
    console.log(line);

    const obj = JSON.parse(line);
    if (obj['model'] !== 'MightyMule-FM231') {
        return;
    }

    throttledOnDrivewayAlert(obj);
});

rtl433.stderr.on('data', (data) => {
    process.stderr.write(data);
});

rtl433.on('close', (code) => {
    console.log(`rtl_433 exited with code ${code}`);
    process.exit(code);
});

// onDrivewayAlert({"time" : "2022-04-24 16:41:14", "model" : "MightyMule-FM231", "count" : 1, "num_rows" : 1, "len" : 9, "data" : "728", "battery_ok" : "1", "id" : 5});

