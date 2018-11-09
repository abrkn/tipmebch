const disabled = require('./disabled');

// exports.tipbch = require('./tip');
exports.tipbch = disabled;
exports.balance = require('./balance');
exports.balancereport = require('./balanceReport');
// exports.deposit = require('./deposit');
exports.deposit = disabled;
exports.withdraw = require('./withdraw');
exports.help = require('./help');
exports.about = require('./about');
exports.stats = require('./stats');
exports.start = require('./start');
exports.setstickerset = require('./setStickerSet');
exports.undo = require('./undo');
exports.claim = require('./claim');

// TODO: Remove by 2018-05-01
exports.reverse = exports.undo;
