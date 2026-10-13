const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { secret, authenticate, requireAdmin } = require('../app_api/middleware/auth');
const { validateTrip } = require('../app_api/middleware/validation');
const KEY = 'unit-test-secret-longer-than-thirty-two-characters';
process.env.JWT_SECRET = KEY;
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }
const sample = { code:'A1',name:'Beach',length:'7 days',start:'2026-12-01',resort:'Resort',perPerson:'$200',image:'beach.jpg',description:'Trip' };
test('secret fails closed for missing or weak configuration', () => {
  delete process.env.JWT_SECRET; assert.throws(secret, /JWT_SECRET/);
  process.env.JWT_SECRET = 'short'; assert.throws(secret, /JWT_SECRET/);
  process.env.JWT_SECRET = KEY; assert.equal(secret(), KEY);
});
test('missing token rejected', () => { const res=response(); authenticate({headers:{}},res,()=>assert.fail()); assert.equal(res.statusCode,401); });
test('valid admin token accepted', () => { const req={headers:{authorization:'Bearer '+jwt.sign({role:'admin'},KEY,{subject:'123'})}};const res=response();let called=false;authenticate(req,res,()=>{called=true;});assert.equal(called,true);assert.equal(req.user.role,'admin'); });
test('user cannot modify trips', () => {const res=response();requireAdmin({user:{role:'user'}},res,()=>assert.fail());assert.equal(res.statusCode,403); });
test('administrator may modify trips', () => {let called=false;requireAdmin({user:{role:'admin'}},response(),()=>{called=true});assert.equal(called,true); });
test('rejects invalid and extra trip fields', () => {assert.match(validateTrip({...sample,name:''}).error,/name/);assert.match(validateTrip({...sample,isAdmin:true}).error,/Unexpected/);assert.match(validateTrip({...sample,start:'not-a-date'}).error,/start/); });
test('accepts complete valid trip', () => {assert.equal(validateTrip(sample).value.name,'Beach'); });
