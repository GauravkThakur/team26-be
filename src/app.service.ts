import { Injectable } from '@nestjs/common';
import { CosmosClient, PartitionKeyDefinition } from '@azure/cosmos';
import { endpoint, connectionString, database, container } from './config';

@Injectable()
export class AppService {
  client: CosmosClient;
  options = {
    endpoint,
    key: connectionString,
    userAgentSuffix: 'CosmosDBJavascriptQuickstart',
  };
  config = {
    database,
    container,
  };

  partitionKey = { kind: 'Hash', paths: ['/partitionKey'] };

  constructor() {
    this.client = new CosmosClient(this.options);
  }

  async getAllJobs() {
    return this.queryContainer();
  }

  async updateJobById({ id }) {
    console.log(id);
    const res = await this.queryContainer(id);
    console.log(res);
    await this.replaceFamilyItem(res[0]);
  }

  async getBatchJobById(id) {
    return this.queryContainer(id);
  }

  async createDatabase() {
    const { database } = await this.client.databases.createIfNotExists({
      id: this.config.database.id,
    });
  }

  async readDatabase() {
    const { resource: databaseDefinition } = await this.client
      .database(this.config.database.id)
      .read();
    console.log(`Reading database:\n${databaseDefinition.id}\n`);
  }

  async createContainer() {
    const { container } = await this.client
      .database(this.config.database.id)
      .containers.createIfNotExists({
        id: this.config.container.id,
        partitionKey: this.partitionKey as PartitionKeyDefinition,
      });
    console.log(`Created container:\n${this.config.container.id}\n`);
  }

  async readContainer() {
    const { resource: containerDefinition } = await this.client
      .database(this.config.database.id)
      .container(this.config.container.id)
      .read();
    console.log(`Reading container:\n${containerDefinition.id}\n`);
  }

  async createFamilyItem(itemBody) {
    const { item } = await this.client
      .database(this.config.database.id)
      .container(this.config.container.id)
      .items.upsert(itemBody);
    console.log(`Created family item with id:\n${itemBody.id}\n`);
  }

  async queryContainer(id?) {
    console.log(`Querying container:\n${this.config.container.id}`);
    const substring = `r WHERE r.id = @id`;

    // query to return all children in a family
    // Including the partition key value of country in the WHERE filter results in a more efficient query
    const querySpec = {
      query: `SELECT * FROM root ${id ? substring : ''}`,
      ...(id && {
        parameters: [
          {
            name: '@id',
            value: id,
          },
        ],
      }),
    };
    const { resources: results } = await this.client
      .database(this.config.database.id)
      .container(this.config.container.id)
      .items.query(querySpec)
      .fetchAll();
    for (var queryResult of results) {
      let resultString = JSON.stringify(queryResult);
      console.log(`\tQuery returned ${resultString}\n`);
    }
    return results;
  }

  async replaceFamilyItem(itemBody) {
    console.log(`Replacing item:\n${itemBody.id}\n`);
    // Change property 'grade'
    itemBody.enabled = !itemBody.enabled;
    const { item } = await this.client
      .database(this.config.database.id)
      .container(this.config.container.id)
      .item(itemBody.id, itemBody.partitionKey)
      .replace(itemBody);
  }

  async deleteFamilyItem(itemBody) {
    await this.client
      .database(this.config.database.id)
      .container(this.config.container.id)
      .item(itemBody.id, itemBody.partitionKey)
      .delete(itemBody);
    console.log(`Deleted item:\n${itemBody.id}\n`);
  }

  async cleanup() {
    await this.client.database(this.config.database.id).delete();
  }

  async scaleContainer() {
    const { resource: containerDefinition } = await this.client
      .database(this.config.database.id)
      .container(this.config.container.id)
      .read();

    try {
      const { resources: offers } = await this.client.offers
        .readAll()
        .fetchAll();

      const newRups = 500;
      for (var offer of offers) {
        if (containerDefinition._rid !== offer.offerResourceId) {
          continue;
        }
        offer.content.offerThroughput = newRups;
        const offerToReplace = this.client.offer(offer.id);
        await offerToReplace.replace(offer);
        console.log(`Updated offer to ${newRups} RU/s\n`);
        break;
      }
    } catch (err) {
      if (err.code == 400) {
        console.log(`Cannot read container throuthput.\n`);
        console.log(err.body.message);
      } else {
        throw err;
      }
    }
  }
}
