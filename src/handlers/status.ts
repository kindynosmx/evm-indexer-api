import { Bool, OpenAPIRoute, Str } from '@cloudflare/itty-router-openapi'

import { query } from '@/db'
import { apiSuccess } from '@/responses'
import { IEnv } from '@/types'

export class Status extends OpenAPIRoute {
  static schema = {
    responses: {
      '200': {
        schema: {
          data: [
            {
              blocks: new Str(),
              chain: new Str(),
              contracts: new Str(),
              dex_trades: new Str(),
              erc20_transfers: new Str(),
              erc721_transfers: new Str(),
              erc1155_transfers: new Str(),
              logs: new Str(),
              receipts: new Str(),
              traces: new Str(),
              transactions: new Str(),
              withdrawals: new Str(),
            },
          ],
          success: new Bool(),
        },
      },
      '500': {
        schema: {
          error: new Str({ example: 'internal server error' }),
          success: new Bool({ example: false }),
        },
      },
    },
    summary: 'Returns the status and the latest working version of the app',
    tags: ['Global'],
  }

  async handle(request: Request, env: IEnv) {
    const [
      { data: blocksIndexed },
      { data: transactionsIndexed },
      { data: contractsIndexed },
      { data: receiptsIndexed },
      { data: logsIndexed },
      { data: dexTrades },
      { data: erc20Transfers },
      { data: erc721Transfers },
      { data: erc1155Transfers },
      { data: tracesIndexed },
      { data: withdrawalsIndexed },
    ] = await Promise.all([
      query<{ blocks: number; chain: number }>(
        env,
        'SELECT sum(blocks) as blocks, chain FROM indexer.blocks_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; transactions: number }>(
        env,
        'SELECT sum(transactions) as transactions, chain FROM indexer.transactions_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; contracts: number }>(
        env,
        'SELECT sum(contracts) as contracts, chain FROM indexer.contracts_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; receipts: number }>(
        env,
        'SELECT sum(receipts) as receipts, chain FROM indexer.receipts_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; logs: number }>(
        env,
        'SELECT sum(logs) as logs, chain FROM indexer.logs_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; dex_trades: number }>(
        env,
        'SELECT sum(dex_trades) as dex_trades, chain FROM indexer.dex_trades_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; erc20_transfers: number }>(
        env,
        'SELECT sum(erc20_transfers) as erc20_transfers, chain FROM indexer.erc20_transfers_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; erc721_transfers: number }>(
        env,
        'SELECT sum(erc721_transfers) as erc721_transfers, chain FROM indexer.erc721_transfers_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; erc1155_transfers: number }>(
        env,
        'SELECT sum(erc1155_transfers) as erc1155_transfers, chain FROM indexer.erc1155_transfers_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; traces: number }>(
        env,
        'SELECT sum(traces) as traces, chain FROM indexer.traces_count_by_chain GROUP BY chain',
      ),
      query<{ chain: number; withdrawals: number }>(
        env,
        'SELECT sum(withdrawals) as withdrawals, chain FROM indexer.withdrawals_count_by_chain GROUP BY chain',
      ),
    ])

    const fullChainData = blocksIndexed?.map((chainInfo) => {
      const chainTransactions = transactionsIndexed?.find((items) => items.chain === chainInfo.chain)?.transactions || 0

      const chainContracts = contractsIndexed?.find((items) => items.chain === chainInfo.chain)?.contracts || 0

      const chainReceipts = receiptsIndexed?.find((items) => items.chain === chainInfo.chain)?.receipts || 0

      const chainLogs = logsIndexed?.find((items) => items.chain === chainInfo.chain)?.logs || 0

      const chainDexTrades = dexTrades?.find((items) => items.chain === chainInfo.chain)?.dex_trades || 0

      const chainErc20Transfers = erc20Transfers?.find((items) => items.chain === chainInfo.chain)?.erc20_transfers || 0

      const chainErc721Transfers =
        erc721Transfers?.find((items) => items.chain === chainInfo.chain)?.erc721_transfers || 0

      const chainErc1155Transfers =
        erc1155Transfers?.find((items) => items.chain === chainInfo.chain)?.erc1155_transfers || 0

      const chainTraces = tracesIndexed?.find((items) => items.chain === chainInfo.chain)?.traces || 0

      const chainWithdrawals = withdrawalsIndexed?.find((items) => items.chain === chainInfo.chain)?.withdrawals || 0

      return {
        ...chainInfo,
        contracts: chainContracts,
        dex_trades: chainDexTrades,
        erc20_transfers: chainErc20Transfers,
        erc721_transfers: chainErc721Transfers,
        erc1155_transfers: chainErc1155Transfers,
        logs: chainLogs,
        receipts: chainReceipts,
        traces: chainTraces,
        transactions: chainTransactions,
        withdrawals: chainWithdrawals,
      }
    })

    return apiSuccess(fullChainData)
  }
}
