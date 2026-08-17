local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call("HMGET", key, "tokens", "lastRefill")

local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then
    tokens = capacity
end

if lastRefill == nil then
    lastRefill = now
end

local delta = math.max(0, now - lastRefill)

local refill = delta * refillRate

tokens = math.min(capacity, tokens + refill)

local allowed = 0

if tokens >= requested then
    tokens = tokens - requested
    allowed = 1
end

redis.call(
    "HMSET",
    key,
    "tokens",
    tokens,
    "lastRefill",
    now
)

local ttl = math.ceil(capacity / refillRate)

redis.call(
    "EXPIRE",
    key,
    ttl
)

return {
    allowed,
    tokens
}