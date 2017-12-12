'use strict'

const _ = require('lodash')

const MockProxy = require('./mock')
const { Project } = require('../models')
const UserGroupProxy = require('./user_group')
const UserProjectProxy = require('./user_project')

exports.getById = function (projectId) {
  return Project.findById(projectId).populate('user members group')
    .then(project => UserProjectProxy
      .findOne({ project: project.id })
      .then(data => {
        project.extend = data
        return project
      })
    )
}

exports.findByIds = function (ids) {
  return Project.find({ _id: { $in: ids } })
    .populate('user members group')
}

exports.find = function (sessionUId, query, opt) {
  return Project.find(query, {}, opt).populate('user members group')
    .then(projects => UserProjectProxy.find({
      project: { $in: projects.map(item => item.id) },
      user: sessionUId
    })
      .then(data => projects.map((project) => {
        project.extend = data.filter(item =>
          item.project.toString() === project.id
        )[0]
        return project
      })))
}

exports.updateById = function (project) {
  return Project.update({
    _id: project.id
  }, {
    $set: {
      url: project.url,
      name: project.name,
      members: project.members,
      description: project.description,
      swagger_url: project.swagger_url
    }
  })
}

exports.delById = function (projectId) {
  return MockProxy
    .del({ project: projectId })
    .then(() => UserProjectProxy.delByProjectId(projectId))
    .then(() => Project.remove({ _id: projectId }))
}

module.exports = class ProjectProxy {
  static newAndSave2 (projects) {
    return Project
      .insertMany(projects)
      .then(projects => {
        const userProjectDocs = projects.map((project) => {
          const projectId = project.id
          const userId = project.user
          if (userId) {
            return project.members.concat(userId).map(id => ({ user: id, project: projectId }))
          } else {
            return UserGroupProxy
              .find({ group: project.group })
              .then(docs => docs.map(doc => ({ user: doc.user.id, project: projectId })))
          }
        })
        return Promise.all(userProjectDocs)
          .then(result => UserProjectProxy.newAndSave(_.flattenDeep(result)))
          .then(() => projects)
      })
  }

  static async newAndSave (docs) {
    const projects = await Project.insertMany(docs)
    const userProjectDocs = projects.map((project) => {
      const projectId = project.id
      const userId = project.user
      if (userId) {
        return project.members.concat(userId).map(id => ({ user: id, project: projectId }))
      } else {
        return UserGroupProxy
          .find({ group: project.group })
          .then(docs => docs.map(doc => ({ user: doc.user.id, project: projectId })))
      }
    })
    const result = await Promise.all(userProjectDocs)
    await UserProjectProxy.newAndSave(_.flattenDeep(result))

    return projects
  }

  static findOne (query, opt) {
    return Project.findOne(query, {}, opt).populate('user members group')
  }
}
