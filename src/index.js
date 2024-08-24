
const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

function HexToString(hex) {
  return ethers.toUtf8String(hex);
}

function StringToHex(payload) {
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

function isNumber(num) {
  return !isNaN(num);
}


const GuessGame = ( num ) => {
  const guess = Math.floor(Math.random() * 10);
  if(num === guess) return "Congratulations"
  return "Try again"
 }

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const payload = HexToString(data["payload"]);
  const arrOfPayload = payload.split(" ");

  if (arrOfPayload.length !== 1 || !isNumber(arrOfPayload[0])) {
    const report_req = await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: StringToHex("Invalid format. Provide one number: <number>") }),
    });

    return "reject";
  }

  const number = parseInt(arrOfPayload[0]);

  const result = GuessGame(number);

  const notice_req = await fetch(rollup_server + "/notice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: StringToHex(result) }),
  });

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const payload = data["payload"];
  const route = HexToString(payload);

  const responseObject = "Inspect route not implemented for guessing game";

  const report_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: StringToHex(responseObject) }),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
