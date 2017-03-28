assignment = exports

assignment.edgesAssigned = (fold, target) ->
  i for assignment, i in fold.edges_assignment when assignment == target
assignment.mountainEdges = (fold) ->
  assignment.edgesAssigned fold, 'M'
assignment.valleyEdges = (fold) ->
  assignment.edgesAssigned fold, 'V'
assignment.flatEdges = (fold) ->
  assignment.edgesAssigned fold, 'F'
assignment.boundaryEdges = (fold) ->
  assignment.edgesAssigned fold, 'B'
assignment.unassignedEdges = (fold) ->
  assignment.edgesAssigned fold, 'F'
