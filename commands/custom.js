const sophia = require("sophia");
const { beautifyCode } = require("../lib/custom")
sophia({
  name:'beautify',
  description: 'beautify or format a js code',
  execute: async function (sock,message,args ){
    if(args.length==0 || !m.quoted) return console.wa("Reply a js code to beautify or use .beautify <js code>",message)
    const formattedArgs = args.join(" ")
    const code = formattedArgs || m.quoted;
    const beautifiedCode = await beautifyCode(code)
   if(beautifiedCode){
    await console.wa(beautifiedCode,message)
   } else {
     console.wa("No beautified code available",message)
   }
  },
  accessLevel: 'public',
  category: 'Utility',
  isGroupOnly: false
})
