const bcrypt = require('bcrypt');
const mongoose = require('mongoose'); 


const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    type: {type:String},
    profilePicture: String
  });


  
userSchema.post('save', function (doc, next) {
  console.log('saved user', doc);
  next();
});

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('Incorrect password');
  }
  throw Error('Incorrect email');
};

  

const User = mongoose.model('User', userSchema);

module.exports = User;