<template>
  <div id="app">
    <label for="check">
      <h1>{{ is_appsync ? "Datastore(AppSync)テスト" : "GraphQLのテスト" }}</h1>
    </label>
    <input id="check" type="checkbox" v-model="is_appsync">
    <!-- <button id="mugen" @click="mugen">無限</button> -->
    <!-- AppSync -->
    <template v-if="is_appsync">
      <div>
        <h3>Save Data</h3>
        <label for="title">Title</label>
        <input id="title" type="text" v-model="title">
        <button @click="saveData">save</button>
      </div>
      <div>
        <h3>Query Data
          <span>合計: {{ data.length }}件</span>
          <button @click="queryData">全件取得</button>
          <button @click="data = []">クリア</button>
        </h3>
        <p>
          <label for="search">Search</label>
          <input id="search" type="text" v-model="filter">
          <button @click="filterData">Title検索</button>
        </p>
        <table>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Rating</th>
            <th>Status</th>
            <th></th>
          </tr>
          <tr v-for="(item, index) in data" :key="index">
            <td>{{ item.id }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.rating }}</td>
            <td>{{ item.status }}</td>
            <td>
              <button @click="deleteData(item)">Delete</button>
              <button @click="updateData(item)">Update</button>
            </td>
          </tr>
        </table>
      </div>
    </template>
    <!-- GraphQL -->
    <template v-else-if="!is_appsync">
      <div>
        <h3>Save Data</h3>
        <label for="title_ql">Title</label>
        <input id="title_ql" type="text" v-model="title">
        <button @click="saveGql">save</button>
      </div>
      <div>
        <h3>Query Data
          <span>合計: {{ data.length }}件</span>
          <button @click="queryGql(null)">全件取得</button>
          <button @click="queryGql(100)">100件取得</button>
          <button @click="data = []">クリア</button>
        </h3>
        <p>
          <label for="search_ql">Search</label>
          <input id="search_ql" type="text" v-model="filter">
          <button @click="filterGql">Title検索</button>
        </p>
        <table>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Rating</th>
            <th>Status</th>
            <th></th>
          </tr>
          <tr v-for="(item, index) in data" :key="index">
            <td>{{ item.id }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.rating }}</td>
            <td>{{ item.status }}</td>
            <td>
              <button @click="deleteGql(item)">Delete</button>
              <button @click="updateGql(item)">Update</button>
            </td>
          </tr>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
// AppSync
import { DataStore } from "@aws-amplify/datastore"
import { Post, PostStatus } from "./models"
// import { PredicateAll, Predicates } from '@aws-amplify/datastore/lib-esm/predicates'

// GraphQL
import { API, graphqlOperation } from 'aws-amplify';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
// import * as subscriptions from './graphql/subscriptions';

export default {
  name: 'App',
  data: () => ({
    is_appsync: true,
    data: [],
    title: '',
    filter: ''
  }),
  // beforeMount() {
    // DataStore.observe(Post).subscribe(msg => {
    //   console.log(msg.model, msg.opType, msg.element)
    // })
  // },
  // mounted() {
  //   this.queryData()
  // },
  methods: {
    async saveData() {
      await DataStore.save(
        new Post({
          title: this.title,
          rating: 10,
          status: PostStatus.ACTIVE
        })
      )
    },
    async queryData() {
      const posts = await DataStore.query(Post)
      this.data = posts
    },
    async updateData(item) {
      await DataStore.save(
        Post.copyOf(item, updated => {
          updated.title = `${Date.now()}`
          updated.status =
            updated.status === PostStatus.ACTIVE
              ? PostStatus.INACTIVE
              : PostStatus.ACTIVE
        })
      )
    },
    async deleteData(item) {
      await DataStore.delete(item)
    },
    async filterData() {
      const filter = this.filter
      const posts = await DataStore.query(Post, c => c.title("beginsWith", filter))
      this.data = posts
    // },
    // mugen() {
    //   for(let i in [...Array(5000).keys()].map(item => item+5000)) {
    //     DataStore.save(
    //       new Post({
    //         title: i,
    //         rating: Math.ceil(i/1000),
    //         status: Math.random() > 0.5 ? PostStatus.ACTIVE : PostStatus.INACTIVE
    //       })
    //     )
    //   }
    },
    async saveGql() {
      const $input = {
        title: this.title,
        rating: Math.ceil(Math.random() * 10),
        status: Math.random() > 0.5 ? PostStatus.ACTIVE : PostStatus.INACTIVE
      }
      await API.graphql(graphqlOperation(mutations.createPost, { input: $input }))
    },
    async queryGql(limit) {
      const $limit = limit ? limit : 10000
      const res = await API.graphql(graphqlOperation(queries.listPosts, { limit: $limit }))
      this.data = res.data.listPosts.items
    },
    async updateGql(item) {
      const $input = {
        id: item.id, // required
        status: !item.status
      }
      await API.graphql(graphqlOperation(mutations.updatePost, { input: $input }))
    },
    async deleteGql(item) {
      const $input = {
        id: item.id, // required
      }
      await API.graphql(graphqlOperation(mutations.deletePost, { input:  $input}))
    },
    async filterGql() {
      const $filter = {
        title: {
          beginsWith: this.filter
        }
      }
      const res = await API.graphql(graphqlOperation(queries.listPosts, { filter: $filter, limit: 10000 }))
      this.data = res.data.listPosts.items
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

table {
  border: 1px solid black;
  border-collapse: collapse;
  margin: 0 auto;
}
th, td {
  border: 1px solid black;
  padding: 10px;
  text-align: left;
}
</style>
