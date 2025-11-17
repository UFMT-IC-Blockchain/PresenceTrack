param(
  [Parameter(Mandatory=$true)][string]$Title,
  [string]$Body = "",
  [string[]]$Labels = @(),
  [string[]]$Assignees = @(),
  [string]$Repo = "UFMT-IC-Blockchain/PresenceTrack"
)

$cmd = @("gh","issue","create","-R",$Repo,"-t",$Title)
if ($Body -ne "") { $cmd += @("-b",$Body) }
foreach ($l in $Labels) { if ($l -ne "") { $cmd += @("-l",$l) } }
foreach ($a in $Assignees) { if ($a -ne "") { $cmd += @("-a",$a) } }
& $cmd
