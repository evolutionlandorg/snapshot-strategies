import { formatUnits } from '@ethersproject/units';
// import { getSnapshots } from '../../utils/blockfinder';

const utils_1 = require('../../utils');
import fetch from 'cross-fetch';

export const author = 'perror';
export const version = '1.0.0';

const abi = [
  'function balanceOfEVO(address _account, uint start, uint end) public view returns (uint256 lands, uint apostles)',
  'function totalOfEVO(address _account) public view returns (uint total)',
  'function balanceOfStaking(address _account) external view returns (uint256)'
];

const row = 999;

const get_heco_account_vote = async (addresses, api, block) => {
  const resp = await fetch(api + '/api/snapshot/vote/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ addresses: addresses, block: block })
  });
  return await resp.json();
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  // const blocks = await getSnapshots(
  //   network,
  //   snapshot,
  //   provider,
  //   options.strategies.map((s) => s.network || network)
  // );
  const promiseArray: Promise<any>[] = [];
  const multiNetworkCalls: Map<string, Promise<any>[]> = new Map();
  const multiNetworkCallsInfo: Map<string, string[]> = new Map();
  const hecoInfo = new Map();
  options.strategies.forEach((strategy) => {
    multiNetworkCalls[strategy.network] = [];
    multiNetworkCallsInfo[strategy.network] = [];
    if (strategy.api_host !== '' && strategy.api_host !== undefined) {
      hecoInfo.set('is_use', true);
      hecoInfo.set('host', strategy.api_host);
      hecoInfo.set('land_multiplier', strategy.land_multiplier);
      hecoInfo.set('apostle_multiplier', strategy.apostle_multiplier);
      hecoInfo.set('kton_multiplier', strategy.kton_multiplier);
      return;
    }
    const multiCalls: any[] = [];
    addresses.forEach((address) => {
      multiCalls.push([strategy.params.address, 'totalOfEVO', [address]]);
    });

    promiseArray.push(
      utils_1.multicall(
        strategy.network,
        utils_1.getProvider(strategy.network),
        abi,
        multiCalls,
        { blockTag: blockTag }
      )
    );
  });
  const res = await Promise.all(promiseArray);
  const accountTotal: Map<string, number> = new Map();

  for (let i = 0; i < res.length; i++) {
    const strategy = options.strategies[i];
    for (let j = 0; j < res[i].length; j++) {
      const vote = parseFloat(formatUnits(res[i][j][0], 1)) * 10;
      let page = Math.ceil(vote / row);
      if (page <= 0) {
        page = 1;
      }
      for (let k = 1; k <= page * row; k += row) {
        let currentRow = k + row;
        if (currentRow > vote) {
          currentRow = vote;
        }
        accountTotal[`${addresses[j]}_${strategy.network}`] = vote;
        if (vote <= 0) {
          continue;
        }
        multiNetworkCallsInfo[strategy.network].push(addresses[j]);
        multiNetworkCalls[strategy.network].push([strategy.params.address, 'balanceOfEVO', [addresses[j], k, currentRow]])
      }
    }
  }

  const multiNetworkPromises: Promise<any>[] = [];
  for (const key of Object.keys(multiNetworkCalls)) {
    if (multiNetworkCalls[key].length <= 0) {
      continue;
    }

    multiNetworkPromises.push(
      utils_1.multicall(
        key,
        utils_1.getProvider(key),
        abi,
        multiNetworkCalls[key],
        { blockTag: blockTag }
      )
    );
  }

  const resp = await Promise.all(multiNetworkPromises);
  const accountVote: Map<string, number> = new Map();

  for (let i = 0; i < resp.length; i++) {
    const strategy = options.strategies[i];
    for (let j = 0; j < resp[i].length; j++) {
      const address = multiNetworkCallsInfo[strategy.network][j];
      // get land apostles vote
      if (!accountVote.hasOwnProperty(addresses[j])) {
        accountVote[address] = 0;
      }

      let landNumber = 0;
      let apostleNumber = 0;

      if (resp[i][j].length > 2) {
        landNumber = parseFloat(
          formatUnits(resp[i][j][0], strategy.params.decimals)
        );
        apostleNumber = parseFloat(
          formatUnits(resp[i][j][1], strategy.params.decimals)
        );
      }
      const ktonNumber = accountTotal[`${address}_${strategy.network}`] - landNumber - apostleNumber

      accountVote[address] += landNumber * strategy.params.land_multiplier;
      accountVote[address] += apostleNumber * strategy.params.apostle_multiplier;
      accountVote[address] += ktonNumber * strategy.params.kton_multiplier;
    }
  }
  // get Heco network vote from evo backend
  console.log(hecoInfo.has('is_use'));
  if (hecoInfo.has('is_use')) {
    const resp = await get_heco_account_vote(
      addresses,
      hecoInfo['host'],
      blockTag
    );
    for (const key of resp) {
      if (!accountVote.hasOwnProperty(key)) {
        accountVote[key] = 0;
      }
      accountVote[key] += resp[key]['land'] * hecoInfo['land_multiplier'];
      accountVote[key] += resp[key]['apostle'] * hecoInfo['apostle_multiplier'];
      accountVote[key] += resp[key]['kton'] * hecoInfo['kton_multiplier'];
    }
  }
  return accountVote;
}
