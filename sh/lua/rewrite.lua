local function urlEncode(s)
    s = string.gsub(s, "([^%w%.%- ])", function(c) return string.format("%%%02X", string.byte(c)) end)
   return string.gsub(s, " ", "+")
end

local function urlDecode(s)
   s = string.gsub(s, '%%(%x%x)', function(h) return string.char(tonumber(h, 16)) end)
   return s
end
-- get token
local token = ngx.var.arg_t
-- valid token 
if (token == nil or token == "" ) then
    ngx.exit(ngx.HTTP_FORBIDDEN)
end
-- import jwt module
local jwt = require "resty.jwt"
-- verify token 
local rs = jwt:verify("secret", token)
if not rs.verified then
   ngx.exit(ngx.HTTP_FORBIDDEN)
end
-- verify tolen expire time 
local ngx_time = ngx.time();
if (ngx_time < rs.payload.expire) then
  ngx.exit(ngx.HTTP_FORBIDDEN)
end
-- set download reponse header
ngx.header["Pragma"] = "No-cache"
ngx.header["Cache-Control"] = "No-cache"
ngx.header["Expires"] = 0
ngx.header["Content-type"] = "application/octet-stream"
ngx.header["Content-Disposition"] = "attachment;filename=" .. urlEncode(rs.payload.name .. "." .. rs.payload.ext)
-- rewrite 
ngx.req.set_uri(rs.payload.path )