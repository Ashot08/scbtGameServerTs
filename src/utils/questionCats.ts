import { DbQuestionCat } from '../typings/types.ts';

export function getCatChildren(catId: number, allCats: DbQuestionCat[]) {
  const children = allCats.filter((c: DbQuestionCat) => c.parent_id === catId);
  return children;
}

export function getCatChildrenAllDepth(catId: number, allCats: DbQuestionCat[]) {
  let children = getCatChildren(catId, allCats);
  let limit = 0;
  let childrenTemp = [...children];
  while (true) {
    limit += 1;
    if (limit > 100000) {
      break;
    }
    const child = childrenTemp.pop();
    if (child) {
      const newChildren = getCatChildren(child.id, allCats);
      childrenTemp = [
        ...childrenTemp,
        ...newChildren,
      ];
      children = children.concat(newChildren);
    }
    if (childrenTemp.length <= 0) {
      break;
    }
  }
  return children;
}

export function getCatsTree(allCats: DbQuestionCat[]) {
  return createTreeData(allCats);
}
function createTreeData(arr: any) {
  const tree = Object.fromEntries(arr.map((n: any) => [n.id, { ...n, children: [] }]));
  return Object.values(tree).filter((n) => !tree[n.parent_id]?.children.push(n));
}
