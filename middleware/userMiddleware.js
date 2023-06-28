const passwordRequirements = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%#*?&])[0-9a-zA-Z@$!%*?&]{8,}$/;

const validator = require('email-validator')


function checkPassword(req, res, next) {
  const { password } = req.body;
  if (!password.match(passwordRequirements)) {
    return res.status(400).json({ message: 'Password does not meet requirements' });
  }
  next();
}


function checkEmail(req , res , next){
  const email = req.body.email;

  if(!validator.validate(email)){
    return res.status(400).json({ error: 'Invalid email address' });
  }
  next()
}


module.exports = {checkPassword, checkEmail}