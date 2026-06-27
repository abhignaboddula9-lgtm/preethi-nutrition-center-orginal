// Test the exact error path: how does resolveSRVRecord receive undefined?
// The MongoAPIError says 'Option "srvHost" must not be empty'
// srvHost = hosts[0]  (line 340 in connection_string.js)
// So hosts[0] is undefined, meaning hosts array is EMPTY

// This happens when parseOptions() gets isSRV=true but hosts=[]
// Let's find when hosts can be empty for an SRV URI

const pkg = require('mongodb-connection-string-url');
const URL = pkg.default || pkg;

// Try cases that give isSRV=true but empty hosts
const cases = [
  'mongodb+srv://',                          // no user, no host
  'mongodb+srv://user:pass@',                // no host after @
  'mongodb+srv://user:pass@ .mongodb.net/',  // space in host
];

for (const uri of cases) {
  try {
    const u = new URL(uri);
    console.log(`URI: ${uri}`);
    console.log(`  hosts: ${JSON.stringify(u.hosts)}, isSRV: ${u.isSRV}`);
    if (!u.hosts || u.hosts.length === 0) {
      console.log('  ^^^ hosts is empty array - srvHost = hosts[0] = UNDEFINED -> crash!');
    }
  } catch(e) {
    console.log(`URI: ${uri}`);
    console.log(`  PARSE ERROR: ${e.message}`);
  }
}
