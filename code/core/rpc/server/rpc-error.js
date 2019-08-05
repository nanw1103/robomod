class RpcError extends Error {
	constructor(msg, code) {
		super(msg)
		this.code = code || 'RBM_RPC_ERROR'
	}
}

module.exports = RpcError