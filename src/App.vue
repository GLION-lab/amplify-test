<template>
  <div id="app">
    <a @click.prevent="is_storage = !is_storage">{{ is_storage ? 'AppSync/GraphQL' : 'Storage/Auth' }}機能のテストはこちらをクリック</a>

    <!-- Storage/Auth -->
    <template v-if="is_storage">
      <h1>Storage/Authのテスト</h1>
      <p>テスト用にアカウントを作成、または下記情報でログインしてStorage機能をテストしてください</p>
      <p>
        email: test@mail.com
        <br>password: password
      </p>
      <amplify-authenticator :authConfig="authConfig"></amplify-authenticator>
      <template v-if="is_signedIn">
        <amplify-sign-out></amplify-sign-out>
        <p>
          <label for="path">アップロード先のパス</label>
          <input type="text" id="path" v-model="photoPickerConfig.path" placeholder="/">
        </p>
        <amplify-photo-picker :photoPickerConfig="photoPickerConfig"></amplify-photo-picker>
        <amplify-s3-album path="/"></amplify-s3-album>
      </template>
    </template>

    <!-- AppSync/GraphQL -->
    <template v-else>
      <label for="check">
        <h1>{{ is_appsync ? "Datastore(AppSync)テスト" : "GraphQLのテスト" }}</h1>
      </label>
      <a @click.prevent="is_appsync = !is_appsync">{{ is_appsync ? 'GraphQL' : 'AppSync' }}機能のテストはこちらをクリック</a>
      <br>
      <a href="#s3">S3の画像</a>
      <!-- <button id="mugen" @click="mugen">無限</button> -->

      <!-- AppSync -->
      <template v-if="is_appsync">
        <p>
          DataStoreでは初期表示時にバックエンドでデータを同期します。
          <br>初期同期の確認: chromeのシークレットモードでブラウザの開発者ツールNetworkタブを開いた状態でアクセスしてください。
          <br>100件ずつに分けて全件取得している様子を確認できます。
        </p>
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
        <p>
          Datastoreとは異なり、バックエンドでの同期はありません。
          <br>1度でデータを取得している様子が確認できます。
          <br>動作自体はRestAPIと同様になります。
          <br>現在、Datastoreの同期と同居した状態になっているため、更新削除はエラーで動作しません。（保存取得の確認のみ可能）
        </p>
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

      <h3 id="s3">S3の画像</h3>
      <amplify-s3-album path="/"></amplify-s3-album>

    </template>

  </div>
</template>

<script>
// Auth
import { AmplifyEventBus } from 'aws-amplify-vue';
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
    // Auth
    is_storage: false,
    authConfig: {
      usernameAttributes: 'Email',
      signUpConfig: {
        header: 'My Customized Sign Up',
        hideAllDefaults: true,
        defaultCountryCode: '1',
        signUpFields: [
          {
            label: 'Email',
            key: 'username',
            required: true,
            displayOrder: 1,
            type: 'string',
          },
          {
            label: 'Password',
            key: 'password',
            required: true,
            displayOrder: 2,
            type: 'password'
          }
        ]
      }
    },
    // Storage
    photoPickerConfig: {
      path: '/'
    },
    // AppSync, GraphQL
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
  computed: {
    is_signedIn() {
      const flg = localStorage.getItem('amplify-signin-with-hostedUI')
      return flg
    }
  },
  mounted() {
    // this.queryData()
    AmplifyEventBus.$on('authState', res => {
      console.log(`Auth event info: ${res}`)
    });
    AmplifyEventBus.$on('fileUpload', res => {
      console.log(`File Upload info: ${res}`)
    });
  },
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

a {
  color: blue;
  cursor: pointer;
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
