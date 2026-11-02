const { test } = require('node:test');
const assert = require('node:assert/strict');
const sqlite3 = require('sqlite3').verbose();
const { validateCredentials, register, login } = require('../helpers/auth');
const { createApp, initializeDatabase } = require('../app');
const call = (fn, db, body) => new Promise(resolve => fn(db, body, (error, username) => resolve({ error, username })));
async function database(t) {
    const db = new sqlite3.Database(':memory:');
    t.after(() => new Promise((resolve, reject) => db.close(e => e ? reject(e) : resolve())));
    await new Promise((resolve, reject) => initializeDatabase(db, e => e ? reject(e) : resolve()));
    return db;
}
for (const body of [{}, {username:' ', password:'x'}, {username:'a',password:' '}, {username:42,password:'x'}, {username:'a',password:['x']}]) {
    test('reject invalid credentials ' + JSON.stringify(body), async () => {
        assert.equal(validateCredentials(body).error, 'Please enter a username and password.');
        for (const fn of [register, login]) {
            const result = await call(fn, {}, body); // No database access for invalid inputs.
            assert.equal(result.error, 'Please enter a username and password.');
        }
    });
}
test('trim usernames while preserving passwords', () => {
    assert.deepEqual(validateCredentials({username:' alice ',password:' pass '}), {username:'alice',password:' pass ',error:null});
});
test('register, persist, and log in with normalized username', async t => {
    const db = await database(t);
    assert.deepEqual(await call(register,db,{username:' alice ',password:' pass '}),{error:null,username:'alice'});
    assert.deepEqual(await call(login,db,{username:' alice ',password:' pass '}),{error:null,username:'alice'});
    assert.equal((await call(login,db,{username:'alice',password:'pass'})).error,'Invalid username or password.');
});
test('duplicate account cannot overwrite original password', async t => {
    const db=await database(t);
    await call(register,db,{username:'alice',password:'original'});
    assert.equal((await call(register,db,{username:' alice ',password:'replacement'})).error,'That username is already taken.');
    assert.equal((await call(login,db,{username:'alice',password:'original'})).error,null);
    assert.equal((await call(login,db,{username:'alice',password:'replacement'})).error,'Invalid username or password.');
});
test('unknown user and wrong password fail', async t => {
    const db=await database(t);
    await call(register,db,{username:'alice',password:'secret'});
    for (const body of [{username:'missing',password:'secret'},{username:'alice',password:'wrong'}]) {
        assert.equal((await call(login,db,body)).error,'Invalid username or password.');
    }
});
test('SQL-like inputs are stored literally and cannot bypass login', async t => {
    const db=await database(t);
    const username="' OR 1=1 --";
    await call(register,db,{username,password:'secret'});
    assert.equal((await call(login,db,{username,password:'wrong'})).error,'Invalid username or password.');
    assert.equal((await call(login,db,{username,password:'secret'})).username,username);
});
test('database errors return friendly messages', async () => {
    const db={run(sql,params,cb){cb({code:'SQLITE_IOERR'});},get(sql,params,cb){cb(new Error('internal detail'));}};
    assert.equal((await call(register,db,{username:'a',password:'b'})).error,'Could not create your account. Please try again.');
    assert.equal((await call(login,db,{username:'a',password:'b'})).error,'Could not log in. Please try again.');
});
test('HTTP forms, registration session, login session, and protected page', async t => {
    const db=await database(t);
    const server=createApp(db).listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    t.after(()=>new Promise(resolve=>server.close(resolve)));
    const base='http://127.0.0.1:'+server.address().port;
    async function request(path, body, cookie) {
        return fetch(base+path,{method:body ? 'POST':'GET',redirect:'manual',headers:{...(body ? {'Content-Type':'application/x-www-form-urlencoded'}:{}),...(cookie ? {Cookie:cookie}:{})},...(body ? {body:new URLSearchParams(body)}:{})});
    }
    assert.equal((await request('/')).headers.get('location'),'/login');
    assert.equal((await request('/landing')).headers.get('location'),'/login');
    for (const path of ['/login','/register']) {
        assert.equal((await request(path)).status,200);
        const bad=await request(path,{username:' ',password:'x'});
        assert.match(await bad.text(),/Please enter a username and password/);
        assert.equal(bad.headers.get('set-cookie'),null);
    }
    const created=await request('/register',{username:'alice',password:'secret'});
    assert.equal(created.status,302);
    assert.equal(created.headers.get('location'),'/landing');
    const cookie=created.headers.get('set-cookie').split(';')[0];
    assert.match(await (await request('/landing',null,cookie)).text(),/alice/);
    assert.match(await (await request('/register',{username:'alice',password:'other'})).text(),/already taken/);
    const failed=await request('/login',{username:'alice',password:'wrong'});
    assert.match(await failed.text(),/Invalid username or password/);
    assert.equal(failed.headers.get('set-cookie'),null);
    const signedIn=await request('/login',{username:'alice',password:'secret'});
    assert.equal(signedIn.headers.get('location'),'/landing');
    assert.match(await (await request('/landing',null,signedIn.headers.get('set-cookie').split(';')[0])).text(),/alice/);
});
