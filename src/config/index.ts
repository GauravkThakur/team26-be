const endpoint = 'https://team26db.documents.azure.com:443/';
const connectionString =
  process.env.TEAM26_COSOMOS_KEY;

const database = {
  id: 'BatchJobs',
};

const container = {
  id: 'Items',
};

const items = [
  {
    id: 'job1',
    name: 'Process 1',
    enabled: false,
    payload: {
      delay: 10000,
    },
  },
  {
    id: 'job2',
    name: 'Process 2',
    enabled: true,
    payload: {
      delay: 15000,
    },
  },
  {
    id: 'job3',
    name: 'Process 3',
    enabled: false,
    payload: {
      delay: 20000,
    },
  },
];

export {
    endpoint,
    connectionString,
    database,
    container,
    items,
};
