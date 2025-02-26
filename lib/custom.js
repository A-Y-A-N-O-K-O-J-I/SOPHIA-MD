const beautify = require('js-beautify').js;
async function beautifyCode(data) {
    try {
        const formattedCode = beautify(data, { indent_size: 2, space_in_empty_paren: true }); // Store beautified code
      return formattedCode
    } catch (err) {
        console.error("Error reading file:", err);
        throw err
    }
}
module.exports = { beautifyCode }