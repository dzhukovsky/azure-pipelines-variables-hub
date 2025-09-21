import { getVariableGroups } from "../../services/variableGroupService";
import { useQuery } from "@tanstack/react-query";
import { VariablesMatrix } from "../VariablesMatrix";
import { IFilter } from "azure-devops-ui/Utilities/Filter";

export type MatrixTabProps = {
  filter: IFilter;
};

export const MatrixTab = ({ filter }: MatrixTabProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["matrix-tab/variable-groups"],
    queryFn: getVariableGroups,
    initialData: [],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return <VariablesMatrix variableGroups={data} filter={filter} />;
};
