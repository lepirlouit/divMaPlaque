const fetch = require('node-fetch');

const plaqueInput = process.argv[2];
const plaque = plaqueInput.replace(/[\.,\-,\s]/g, '');

function extractIdValue(regex, body) {
  const match = regex.exec(body);
  const valueId = match[1];
  return valueId;
}
function parseCookies(response) {
  const raw = response.headers.raw()['set-cookie'];
  return raw.map((entry) => {
    const parts = entry.split(';');
    const cookiePart = parts[0];
    return cookiePart;
  }).join(';');
}
const getIds = async () => {
  const response = await fetch('https://www.mobilit.fgov.be/WebdivPub_FR/wmvpstv1_fr');
  const cookies = parseCookies(response);
  const body = await response.text();
  const windowIdRegEx = /windowId=(\d*);/gm;
  const windowId = extractIdValue(windowIdRegEx, body);
  const pStepIdRegEx = /pStepId=(\d*);/gm;
  const pStepId = extractIdValue(pStepIdRegEx, body);
  const subsessionRegEx = /subSessionId=(\d*);/gm;
  const subSessionId = extractIdValue(subsessionRegEx, body);
  return ({ subSessionId, windowId, pStepId, cookies });

}

const getStatus = async () => {
  const { subSessionId, windowId, pStepId, cookies } = await getIds();
  const url = `https://www.mobilit.fgov.be/WebdivPub_FR/wmvpstv1_fr.jsp?${new URLSearchParams({
    SUBSESSIONID: subSessionId,
    DYNAMIC: 'DOREQUEST',
    NAME: 'CMV_WD_PBL01_CONSULT_STATUS',
    PSTEPID: pStepId,
    WINDOWID: windowId,
    PAGEDATA: Buffer.from(`RC142 on Click~RC126 ~RC130 ${plaque}~RC134 ~`).toString('hex').toUpperCase(),
  }).toString()}`;
  const response = await fetch(url, {
    'headers': {
      'accept': '*/*',
      'cookie': cookies,
    },
    'method': 'GET',
  });
  const body = await response.text();
  // const body = fs.readFileSync('response2.txt').toString();;
  // const windowId = 261966954;

  const regex2 = new RegExp(`	parent.instanciate\\(new Array\\('EntryField','${windowId}','CMV_WD_PBL01_CONSULT_STATUS','Readonly1',"(.*)"\\)\\).setAttributes\\(false,'','','none','noop',null,null\\);`, 'gm');
  console.log(extractIdValue(regex2, body).replace(/\\/g, ''));

}
getStatus("");



