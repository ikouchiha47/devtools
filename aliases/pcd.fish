function pcd -d "push the current directory in stack and cd. popd to switch back"
  while popd > /dev/null
    continue
  end
  pushd $(pwd)
  cd $argv
end
