var mongoose          = require('mongoose')
var graphql           = require('graphql')

var GraphQLBoolean    = graphql.GraphQLBoolean
var GraphQLID         = graphql.GraphQLID
var GraphQLList       = graphql.GraphQLList
var GraphQLNonNull    = graphql.GraphQLNonNull
var GraphQLObjectType = graphql.GraphQLObjectType
var GraphQLSchema     = graphql.GraphQLSchema
var GraphQLString     = graphql.GraphQLString

var TASK = mongoose.model('Task', {
  id:             mongoose.Schema.Types.ObjectId,
  title:          String,
  reporter:       String,
  owner:          String,
  completed:      Boolean,
  dateAssigned:   String,
  dateCompleted:  String
})

// var USER = mongoose.model('User', {
//   id:         mongoose.Schema.Types.ObjectId,
//   name:      String,
// })

mongoose.connect('mongodb://127.0.0.1:27017/tasks', function (error) {
  if (error) console.error(error)
  else console.log('mongo connected')
})

// var UserType = new GraphQLObjectType({
//   name: 'user',
//   description: 'Represent the type of a user of a task owner or reporter',
//   fields: () => ({
//     _id:  {type: GraphQLID},
//     name: {type: GraphQLString}
//   })
// });

var TaskType = new GraphQLObjectType({
  name: 'task',
  fields: () => ({
    id: {
      type: GraphQLID,
      description: 'Task id'
    },
    title: {
      type: GraphQLString,
      description: 'Task title'
    },
    completed: {
      type: GraphQLBoolean,
      description: 'Flag to mark if the task is completed'
    },
    owner: {
      type: GraphQLString,
      description: 'Task Owner reponsible for execution of task'
    },
    reporter: {
      type: GraphQLString,
      description: 'Task Reporter reponsible for listing the task'
    },
    dateAssigned: {
      type: GraphQLString,
      description: 'Date task assigned'
    },
    dateCompleted: {
      type: GraphQLString,
      description: 'Date task completed'
    }
  })
})

var promiseListAll = () => {
  return new Promise((resolve, reject) => {
    TASK.find((err, tasks) => {
      if (err) reject(err)
      else resolve(tasks)
    })
  })
}

var QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    tasks: {
      type: new GraphQLList(TaskType),
      resolve: () => {
        return promiseListAll()
      }
    }
  })
})

var MutationAdd = {
  type: TaskType,
  description: 'Add a Task',
  args: {
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Task title'
    },
    owner: {
      type: GraphQLString,
      description: 'Task Owner reponsible for execution of task'
    },
    reporter: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Task Reporter reponsible for listing the task'
    },
    dateAssigned: {
      type: GraphQLString,
      description: 'Date task assigned'
    }
  },
  resolve: (root, args) => {
    var newTask = new TASK({
      title:          args.title,
      completed:      false,
      owner:          args.owner,
      reporter:       args.reporter,
      dateAssigned:   args.dateAssigned,
      dateCompleted:  false,
    })
    newTask.id = newTask._id
    return new Promise((resolve, reject) => {
      newTask.save(function (err) {
        if (err) reject(err)
        else resolve(newTask)
      })
    })
  }
}

var MutationDestroy = {
  type: TaskType,
  description: 'Destroy the task',
  args: {
    id: {
      name: 'Task Id',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, args) => {
    return new Promise((resolve, reject) => {
      TASK.findById(args.id, (err, task) => {
        if (err) {
          reject(err)
        } else if (!task) {
          reject('Task NOT found')
        } else {
          task.remove((err) => {
            if (err) reject(err)
            else resolve(task)
          })
        }
      })
    })
  }
}

var MutationSave = {
  type: TaskType,
  description: 'Edit a task',
  args: {
    id: {
      name: 'Task Id',
      type: new GraphQLNonNull(GraphQLString)
    },
    title: {
      name: 'Task title',
      type: new GraphQLNonNull(GraphQLString)
    },
    completed: {
      name: 'Completed boolean',
      type: new GraphQLNonNull(GraphQLBoolean)
    },
    owner: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Task Owner reponsible for execution of task'
    },
    dateAssigned: {
      type: GraphQLString,
      description: 'Date task assigned'
    }
  },
  resolve: (root, args) => {
    return new Promise((resolve, reject) => {
      TASK.findById(args.id, (err, task) => {
        if (err) {
          reject(err)
          return
        }

        if (!task) {
          reject('Task NOT found')
          return
        }

        task.title        = args.title
        task.owner        = args.owner
        task.completed    = args.completed
        task.dateAssigned = args.dateAssigned

        task.save((err) => {
          if (err) reject(err)
          else resolve(task)
        })
      })
    })
  }
}

var MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    add:      MutationAdd,
    destroy:  MutationDestroy,
    save:     MutationSave
  }
})

module.exports = new GraphQLSchema({
  query:    QueryType,
  mutation: MutationType
})
